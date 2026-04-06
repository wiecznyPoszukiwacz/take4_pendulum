import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import {
	type JsonRpcRequest,
	type JsonRpcResponse,
	type RpcDispatcher,
	JsonRpcErrorCode,
} from "./types.mjs";
import { type ApiHandler } from "./ApiHandler.mjs";

export class Server {

	private httpServer: HttpServer | null = null;
	private handler: ApiHandler

	public constructor(handler: ApiHandler) {
		this.handler = handler;
	}

	/** Starts the HTTP server on the given port */
	public run(port: number): void {
		this.httpServer = createServer((req, res) => {
			void this.handleIncomingRequest(req, res);
		});

		this.httpServer.listen(port, () => {
			console.log(`Server listening on port ${port}`);
		});
	}

	/** Stops the HTTP server */
	public stop(): void {
		this.httpServer?.close();
		this.httpServer = null;
	}

	/** Reads raw body from incoming HTTP request */
	private readBody(req: IncomingMessage): Promise<string> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			req.on("data", (chunk: Buffer) => chunks.push(chunk));
			req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
			req.on("error", reject);
		});
	}

	/** Parses and validates raw body as a JSON-RPC 2.0 request */
	private parseJsonRpc(raw: string): JsonRpcRequest {
		let body: unknown;
		try {
			body = JSON.parse(raw);
		} catch {
			throw { code: JsonRpcErrorCode.ParseError, message: "Parse error" };
		}

		if (
			typeof body !== "object" ||
			body === null ||
			(body as Record<string, unknown>)["jsonrpc"] !== "2.0" ||
			typeof (body as Record<string, unknown>)["method"] !== "string"
		) {
			throw { code: JsonRpcErrorCode.InvalidRequest, message: "Invalid Request" };
		}

		return body as JsonRpcRequest;
	}

	/** Sends a JSON-RPC 2.0 success response */
	private sendResult(
		res: ServerResponse,
		id: JsonRpcRequest["id"],
		result: unknown,
		extraHeaders?: Record<string, string>,
	): void {
		const response: JsonRpcResponse = { jsonrpc: "2.0", id, result };
		this.sendJson(res, 200, response, extraHeaders);
	}

	/** Sends a JSON-RPC 2.0 error response */
	private sendError(
		res: ServerResponse,
		id: JsonRpcRequest["id"],
		code: number,
		message: string,
	): void {
		const response: JsonRpcResponse = { jsonrpc: "2.0", id, error: { code, message } };
		this.sendJson(res, 200, response);
	}

	/** Serializes and writes a JSON response */
	private sendJson(
		res: ServerResponse,
		status: number,
		body: unknown,
		extraHeaders?: Record<string, string>,
	): void {
		const payload = JSON.stringify(body);
		res.writeHead(status, {
			"Content-Type": "application/json",
			"Content-Length": Buffer.byteLength(payload),
			...extraHeaders,
		});
		res.end(payload);
	}

	/** Entry point for each HTTP request — parses, validates and dispatches to handler */
	private async handleIncomingRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
		if (req.method !== "POST") {
			this.sendError(res, null, JsonRpcErrorCode.InvalidRequest, "Only POST is accepted");
			return;
		}

		let rpcRequest: JsonRpcRequest;
		try {
			const raw = await this.readBody(req);
			rpcRequest = this.parseJsonRpc(raw);
		} catch (err) {
			const { code, message } = err as { code: number; message: string };
			this.sendError(res, null, code, message);
			return;
		}

		if (!this.handler) {
			this.sendError(res, rpcRequest.id, JsonRpcErrorCode.InternalError, "No handler registered");
			return;
		}


		const dispatcher = this.handler as unknown as RpcDispatcher;

		if (typeof dispatcher[rpcRequest.method] !== "function") {
			this.sendError(res, rpcRequest.id, JsonRpcErrorCode.MethodNotFound, `Method not defined: ${rpcRequest.method}`);
			return;
		}

		try {
			const response = await dispatcher[rpcRequest.method]!(rpcRequest.params ?? null);

			if (response === undefined) {
				res.writeHead(204).end();
				return;
			}

			this.sendResult(res, rpcRequest.id, response);

		} catch (err) {
			console.log(err)
			const message = err instanceof Error ? err.message : "Internal error";
			this.sendError(res, rpcRequest.id, JsonRpcErrorCode.InternalError, message);
		}
	}
}
