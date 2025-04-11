import { ActionRowBuilder } from "discord.js";
/**
 * Factory function for creating components with exact ID matching
 */
export function createComponent(component) {
    return component;
}
/**
 * Factory function for creating pattern-based components
 */
export function createPatternComponent(component) {
    return component;
}
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
export function buttonPattern(component) {
    return { ...component, type: "button" };
}
export function stringSelectPattern(component) {
    return { ...component, type: "stringSelect" };
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
