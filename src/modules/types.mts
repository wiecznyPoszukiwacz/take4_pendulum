/** JSON-RPC 2.0 request object */
export interface JsonRpcRequest {
	jsonrpc: "2.0";
	id: string | number | null;
	method: string;
	params?: unknown;
}

/** JSON-RPC 2.0 success response */
export interface JsonRpcSuccessResponse {
	jsonrpc: "2.0";
	id: string | number | null;
	result: unknown;
}

/** JSON-RPC 2.0 error object */
export interface JsonRpcError {
	code: number;
	message: string;
	data?: unknown;
}

/** JSON-RPC 2.0 error response */
export interface JsonRpcErrorResponse {
	jsonrpc: "2.0";
	id: string | number | null;
	error: JsonRpcError;
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

/** A handler object that exposes named JSON-RPC methods callable by string key */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RpcDispatcher = Record<string, (params: any) => unknown>

/** Standard JSON-RPC 2.0 error codes */
export const JsonRpcErrorCode = {
	ParseError: -32700,
	InvalidRequest: -32600,
	MethodNotFound: -32601,
	InvalidParams: -32602,
	InternalError: -32603,
} as const;
