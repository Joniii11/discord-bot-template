;
export function commandFile(command) {
    return {
        name: command.data.name,
        data: command.data,
        options: {
            ...command.options,
            category: command.options?.category ?? "null",
            cooldown: command.options?.cooldown ?? 0
        },
        execute: command.execute,
    };
}
