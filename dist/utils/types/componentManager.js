import { ActionRowBuilder } from "discord.js";
// Component registration helpers
export function buttonComponent(options) {
    return {
        id: options.id,
        type: "button",
        execute: options.execute,
        options: options.options
    };
}
export function stringSelectComponent(options) {
    return {
        id: options.id,
        type: "stringSelect",
        execute: options.execute,
        options: options.options
    };
}
export function modalComponent(options) {
    return {
        id: options.id,
        type: "modal",
        execute: options.execute,
        options: options.options
    };
}
// Pattern-based component registrations
export function buttonPattern(options) {
    return {
        id: options.idPattern.toString(),
        idPattern: options.idPattern,
        type: "button",
        execute: options.execute,
        options: options.options
    };
}
export function selectMenuPattern(options) {
    return {
        id: options.idPattern.toString(),
        idPattern: options.idPattern,
        type: "stringSelect",
        execute: options.execute,
        options: options.options
    };
}
export function modalPattern(options) {
    return {
        id: options.idPattern.toString(),
        idPattern: options.idPattern,
        type: "modal",
        execute: options.execute,
        options: options.options
    };
}
// Helper for creating action rows with typed components
export function createActionRow(...components) {
    return new ActionRowBuilder().addComponents(...components);
}
