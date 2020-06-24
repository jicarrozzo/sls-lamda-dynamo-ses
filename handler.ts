import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { ITemplate, IEmail } from './models/email';
import { Response } from './models/system';
import { SES, DynamoDB } from 'aws-sdk'; //

const db = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const sesServer = new SES({ region: 'us-east-1' });
const statusTable = process.env.STATUS_TABLE;

export const sendEmail: APIGatewayProxyHandler = async (event, _context) => {
	if (event.body == null || event.body == '') {
		return new Response(400, 'Error: el cuerpo del mensaje no contiene el formato requerido');
	}
	const req: IEmail = JSON.parse(event.body);

	const params = buildParams(req);

	try {
		let res: SES.SendTemplatedEmailResponse | SES.SendEmailResponse;
		if (req.templateName)
			res = await sesServer.sendTemplatedEmail(params as SES.Types.SendTemplatedEmailRequest).promise();
		else res = await sesServer.sendEmail(params as SES.SendEmailRequest).promise();
		return new Response(200, { message: 'success', data: res });
	} catch (error) {
		try {
			const dbSaving = await saveErrorEmail(req);
			return new Response(error.statusCode, { error, dbData: { ...dbSaving } });
		} catch (_) {}
	}
};

export const createTemplate: APIGatewayProxyHandler = async (event, _context) => {
	if (event.body == null || event.body == '') {
		return new Response(400, 'Error: el cuerpo del mensaje no contiene el formato requerido');
	}
	const req: ITemplate = JSON.parse(event.body);
	const params: SES.Template = {
		TemplateName: req.templateName,
		HtmlPart: req.body,
		TextPart: '',
		SubjectPart: req.subject
	};

	console.log(params);
	try {
		const response = await sesServer.createTemplate({ Template: params }).promise();
		// console.log(a);
		return new Response(200, { message: 'success', data: response });
	} catch (error) {
		// console.log(error);
		return new Response(error.statusCode, error);
	}
};

export const deleteTemplate: APIGatewayProxyHandler = async (event, _context) => {
	if (event.pathParameters == null || event.pathParameters.name == null) {
		return new Response(400, { error: 'Debe indicar el nombre del template a eliminar' });
	}
	const templateName = event.pathParameters.name;

	const params: SES.Types.DeleteTemplateRequest = {
		TemplateName: templateName
	};

	console.log(params);
	try {
		const response = await sesServer.deleteTemplate(params).promise();
		// console.log(a);
		return new Response(200, { message: 'success', data: response });
	} catch (error) {
		// console.log(error);
		return new Response(error.statusCode, error);
	}
};

export const saveErrorEmail = async (email: IEmail) => {
	const params = {
		Email: email.from,
		DateError: new Date().toLocaleString(),
		Destination: email.destination,
		Message: email.message,
		Template: email.templateName,
		TemplateData: email.templateData
	};
	try {
		await db
			.put({
				TableName: statusTable,
				Item: params
			})
			.promise();
		return new Response(201, params.Email);
	} catch (error) {
		return new Response(null, new Response(error.statusCode, error));
	}
};

export const buildParams = (email: IEmail) => {
	if (email.templateName) {
		return {
			Template: email.templateName,
			Destination: {
				ToAddresses: email.destination.toList
			} as SES.Destination,
			Source: email.from,
			TemplateData: JSON.stringify(email.templateData || {})
		} as SES.Types.SendTemplatedEmailRequest;
	} else {
		return {
			Source: email.from,
			Destination: {
				ToAddresses: email.destination.toList
			} as SES.Destination,
			Message: {
				Subject: { Data: email.message.subject } as SES.Content,
				Body: email.message.body
			} as SES.Message
		} as SES.SendEmailRequest;
	}
};
