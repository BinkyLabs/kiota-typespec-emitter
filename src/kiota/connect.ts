import * as cp from 'node:child_process';
import * as rpc from 'vscode-jsonrpc/node';
import { ensureKiotaIsPresent, getKiotaPath } from './install.js';
import path from 'node:path';
import fs from 'node:fs';


// copied fom JSON RPC because they are missing a file in the package?
class ReadableStreamWrapper implements rpc.RAL.ReadableStream {

	constructor(private readonly stream: NodeJS.ReadableStream) {
	}

	public onClose(listener: () => void): rpc.Disposable {
		this.stream.on('close', listener);
		return rpc.Disposable.create(() => this.stream.off('close', listener));
	}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	public onError(listener: (error: any) => void): rpc.Disposable {
		this.stream.on('error', listener);
		return rpc.Disposable.create(() => this.stream.off('error', listener));
	}

	public onEnd(listener: () => void): rpc.Disposable {
		this.stream.on('end', listener);
		return rpc.Disposable.create(() => this.stream.off('end', listener));
	}

	public onData(listener: (data: Uint8Array) => void): rpc.Disposable {
		this.stream.on('data', listener);
		return rpc.Disposable.create(() => this.stream.off('data', listener));
	}
}

class WritableStreamWrapper implements rpc.RAL.WritableStream {

	constructor(private readonly stream: NodeJS.WritableStream) {
	}

	public onClose(listener: () => void): rpc.Disposable {
		this.stream.on('close', listener);
		return rpc.Disposable.create(() => this.stream.off('close', listener));
	}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	public onError(listener: (error: any) => void): rpc.Disposable {
		this.stream.on('error', listener);
		return rpc.Disposable.create(() => this.stream.off('error', listener));
	}

	public onEnd(listener: () => void): rpc.Disposable {
		this.stream.on('end', listener);
		return rpc.Disposable.create(() => this.stream.off('end', listener));
	}

	public write(data: Uint8Array | string, encoding?: rpc.RAL.MessageBufferEncoding): Promise<void> {
		return new Promise((resolve, reject) => {
			const callback = (error: Error | undefined | null) => {
				if (error === undefined || error === null) {
					resolve();
				} else {
					reject(error);
				}
			};
			if (typeof data === 'string') {
				this.stream.write(data, encoding, callback);
			} else {
				this.stream.write(data, callback);
			}
		});
	}

	public end(): void {
		this.stream.end();
	}
}

// end of copy

export default async function connectToKiota<T>(callback: (connection: rpc.MessageConnection) => Promise<T | undefined>, workingDirectory: string = process.cwd()): Promise<T | undefined | Error> {
  // Convert workingDirectory to an absolute path
  const absoluteWorkingDirectory = path.resolve(workingDirectory);
  // Create the directory if it doesn't exist
  await fs.promises.mkdir(absoluteWorkingDirectory, { recursive: true });
  
  const kiotaPath = getKiotaPath();
  await ensureKiotaIsPresent();
  
  const childProcess = cp.spawn(kiotaPath, ["rpc"], {
    cwd: absoluteWorkingDirectory,
    env: {
      ...process.env,
       
      KIOTA_CONFIG_PREVIEW: "true",
    }
  });
  const inputReader = new rpc.ReadableStreamMessageReader(new ReadableStreamWrapper(childProcess.stdout));
  const outputWriter = new rpc.WriteableStreamMessageWriter(new WritableStreamWrapper(childProcess.stdin));
  const connection = rpc.createMessageConnection(inputReader, outputWriter);
  connection.listen();
  try {
      return await callback(connection);
  } catch (error) {
      console.warn(error);
      const errorMessage = (error as { data?: { message: string } })?.data?.message
          || 'An unknown error occurred';
      return new Error(errorMessage);
  } finally {
    inputReader.dispose();
    outputWriter.dispose();
    connection.dispose();

    childProcess.stdin?.end();
    childProcess.kill();
  }
}