import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("language")
        .setDescription("Set your preferred language")
        .addStringOption(option => option.setName("locale")
        .setDescription("The language to use")
        .setRequired(true)
        .addChoices({ name: 'English', value: 'en-US' }, { name: 'Español', value: 'es-ES' }, { name: 'Français', value: 'fr-FR' }, { name: 'Deutsch', value: 'de-DE' }, { name: '日本語', value: 'ja-JP' })),
    execute: async (cmdExecutor) => {
        const { client } = cmdExecutor;
        const locale = cmdExecutor.getString("locale", true);
        // Here you would save the user's preference to a database
        // For this example, we'll just show the confirmation
        const availableLocales = client.manager.localeManager?.getAvailableLocales() || [];
        if (!availableLocales.includes(locale)) {
            // If the selected locale isn't available yet
            return cmdExecutor.reply(client.manager.t({ key: "commands.language.notAvailable", locale: "en-US", replacements: {
                    locale
                } }));
        }
        // Respond in the new locale to confirm
        const successMessage = client.manager.t({ key: "commands.language.success", locale, replacements: {
                language: locale
            } });
        await cmdExecutor.reply(successMessage);
    }
});
