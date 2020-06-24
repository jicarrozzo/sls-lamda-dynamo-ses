export class Response {
	public body: string;
	constructor(public statusCode: number, message: any) {
		this.body = JSON.stringify(message);
	}
}

// export interface Error{
//   errorCode:number;

// }
