export function eventFile(event) {
    const eventGetter = (event.eventGetter ?? "discord");
    return { ...event, eventGetter };
}
