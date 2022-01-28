import vscode, { Uri } from 'vscode';
// @ts-ignore: No type definitions
import { TextDecoderLite as TextDecoder } from 'text-encoder-lite';
import {
    ResourceProvider as TranspilerResourceProviderBase,
    ResourceHandler as TranspilerResourceHandler
} from 'greybel-transpiler';
import {
    ResourceProvider as InterpreterResourceProviderBase,
    ResourceHandler as InterpreterResourceHandler
} from 'greybel-interpreter';
import path from 'path';

const fs = vscode.workspace.fs;

export class PseudoFS {
	static sep: string = path.sep;

	static basename(file: string): string {
		return path.basename(file);
	}

	static dirname(file: string): string {
		return path.dirname(file);
	}

	static resolve(file: string): string {
		return path.resolve(file);
	}
}

async function tryToGet(targetUri: string): Promise<Uint8Array | null> {
	try {
		return await fs.readFile(Uri.file(targetUri));
	} catch(err) {
		console.error(err);
	}

	return null;
}

async function tryToDecode(targetUri: string): Promise<string> {
	const out = await tryToGet(targetUri);
	return out ? new TextDecoder().decode(out) : '';
}

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
	getHandler(): TranspilerResourceHandler {
		return {
			getTargetRelativeTo: async (source: string, target: string): Promise<string> => {
				const base = Uri.joinPath(Uri.file(source), '..');
				const result = Uri.joinPath(base, target).fsPath;
				return await tryToGet(result) ? result : result + '.src';
			},
			has: async (target: string): Promise<boolean> => {
				return !!(await tryToGet(target));
			},
			get: (target: string): Promise<string> => {
				return tryToDecode(target);
			},
			resolve: (target: string): Promise<string> => {
				return Promise.resolve(Uri.file(target).fsPath);
			}
		};
	}
}

export class InterpreterResourceProvider extends InterpreterResourceProviderBase {
	getHandler(): InterpreterResourceHandler {
		return {
			getTargetRelativeTo: async (source: string, target: string): Promise<string> => {
				const base = Uri.joinPath(Uri.file(source), '..');
				const result = Uri.joinPath(base, target).fsPath;
				return await tryToGet(result) ? result : result + '.src';
			},
			has: async (target: string): Promise<boolean> => {
				return !!(await tryToGet(target));
			},
			get: (target: string): Promise<string> => {
				return tryToDecode(target);
			},
			resolve: (target: string): Promise<string> => {
				return Promise.resolve(Uri.file(target).fsPath);
			}
		};
	}
}