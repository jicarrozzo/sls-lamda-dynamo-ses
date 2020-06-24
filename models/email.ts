/** tipo para representar una direccion */
export type Address = string;
export type MessageData = string;
export type Charset = string;

/** Interfaz para la creacion de un template  */
export interface ITemplate {
	templateName: string;
	subject: string;
	body: string;
}
/** Interfaz para el envio de un email  */
export interface IEmail {
	from: Address;
	destination: IDestination;
	message?: IMessage;
	templateName?: string;
	templateData?: string;
}
/** Interfaz para las direcciones de envio */
export interface IDestination {
	toList: Address[];
	ccList?: Address[];
	bccList?: Address[];
}
/** Interfaz para el mensaje de correo */
export interface IMessage {
	subject: string;
	body: IBody; //string|
}
export interface IContent {
	/** El conetenido textual, string */
	Data: MessageData;
	/** El set de caracteres en caso de ser necesario */
	Charset?: Charset;
}
export interface IBody {
	/** Contenido del body en formato texto plano. Usarlo para cliente de correo de texto plano */
	Text?: IContent;
	/** Contenido del body en formato HTML.*/
	Html?: IContent;
}
