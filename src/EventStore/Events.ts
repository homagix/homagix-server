export type Event = {
  type: string
}

export function assert(condition: unknown, message: string): void {
  if (!condition) {
    const obj = { stack: '' }
    Error.captureStackTrace(obj)
    const stack = obj.stack
      .split('\n')
      .slice(1)
      .map((line: string) => {
        const m = line.match(
          /^\s*at ([\w.<>]*)\s*\(?(.*?):(\d+):(\d+)\)?/
        ) as string[]
        return m && { func: m[1], filename: m[2], lineNo: m[3], char: m[4] }
      })
      .filter(line => line)
    const type = stack[1].func
    const currentfile = stack[0].filename
    const firstForeignFile = stack
      .slice(1)
      .map(e => e.filename)
      .find(s => s !== currentfile)
    const callerFile = firstForeignFile && firstForeignFile.split(/[\\/]/).pop()
    throw `Read model '${callerFile}', event '${type}': ${message}`
  }
}
