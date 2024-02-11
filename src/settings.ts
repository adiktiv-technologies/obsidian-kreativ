import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import { OllamaAPI } from "api/ollama";
import Plugin from "main";

const maxResponseLength = 100;
const writingStyle = "formal"; // "formal", "informal" or "neutral"
const prePrompt = `

Act as an expert in Obsidian note-taking and knowledge management, providing your response in JSON format.
Structure your response to include separate properties for the main response, actionable advice, insights, and relevant keywords. 

* Your response must not exceed ${maxResponseLength} words.
* Use a ${writingStyle} writing style to directly address the user's query.
* Limit the number of keywords to 5.
* Limit the insight to one sentence.
* Limit the advice to one sentence.

Your answer should always be as following form:
\`\`\`json
{
  "response": "Brief answer to the user's query ...",
  "advice": "Actionable steps or tips ...",
  "insights": "Deeper understanding or contextual information ...",
  "keywords": ["keyword1", "keyword2", "keyword3" ...]
}
\`\`\`

Command:
`

// Command:
// ```json
// {
// 	"name": "Elaborate",
// 	"prompt": "Add detail to the text, enriching the original content without altering its meaning. Produce a detailed expansion.",
// 	"input": "As an AI assistant, I've been tasked with unraveling the mysteries of discovery."
// }
// ```

export const DEFAULT_SETTINGS: Settings = {
	prePrompt,
	defaultEngine: "ollama",
	engines: {
		ollama: {
			id: "ollama",
			name: "Ollama",
			url: "http://localhost:11434",
			defaultModel: "",
			models: {} as Record<string, any>
		},
		jan: {
			id: "jan",
			name: "Jan",
			url: "http://localhost:1337",
			defaultModel: "",
			models: {} as Record<string, any>
		}
	},
	commands: [
		{
			name: "Summarize",
			prompt: "Provide a concise summary highlighting the main points. Deliver only the summary, directly and succinctly."
		},
		{
			name: "Clarify",
			prompt: "Explain the text in simpler terms, maintaining the original meaning. Deliver a clear, straightforward explanation."
		},
		{
			name: "Elaborate",
			prompt: "Add detail to the text, enriching the original content without altering its meaning. Produce a detailed expansion."
		},
		{
			name: "Formalize",
			prompt: "Convert the text to a formal tone, preserving its intent. Output the revised text, focusing on formal expression."
		},
		{
			name: "Simplify",
			prompt: "Rewrite the text in a casual, accessible style, keeping the core message intact. Present a casual rewrite."
		},
		{
			name: "Translate to French",
			prompt: "Translate the text to French."
		}
	]
};

export default class SettingTab extends PluginSettingTab {
	plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private cleanUrl(url: string): string {
		// Remove leading and trailing spaces and slashes
		url = url
			.toLowerCase()
			.trim()
			.replace(/^\/+|\/+$/g, "");

		try {
			// Create a URL object
			const urlObj = new URL(url);

			// Construct a clean URL with only the protocol, hostname, and port
			return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ":" + urlObj.port : ""}`;
		} catch (error) {
			if (error instanceof TypeError) {
				new Notice(`Invalid URL: ${url}`);
				return "http://localhost";
			} else {
				throw error;
			}
		}
	}

	private async isServerOnline(url: string): Promise<boolean> {
		try {
			return (await fetch(url)).status === 200;
		} catch (error) {
			console.error(`Error: ${error}`);
			return false;
		}
	}

	private setEngineSelection(plugin: Plugin, containerEl: HTMLElement) {
		return new Setting(containerEl)
			.setName("Engine Selection")
			.setDesc("Choose the default engine for note interactions.")
			.addDropdown((dropdown) => {
				const options = {
					ollama: "Ollama",
					jan: "Jan"
				};
				dropdown
					.addOptions(options)
					.setValue(plugin.settings.defaultEngine)
					.onChange(async (value) => {
						plugin.settings.defaultEngine = value;
						await plugin.saveSettings();
					});
			});
	}

	private createEngineSettings(plugin: Plugin, containerEl: HTMLElement, engine: EngineInfo) {
		const engineSettingDiv = containerEl.createDiv();

		engineSettingDiv.createEl("h3", { text: `${engine.name}` });

		// Create a flex container for the URL input and the check button
		const flexContainer = engineSettingDiv.createDiv();
		flexContainer.style.display = "flex";
		flexContainer.style.gap = "10px"; // Add some space between the input and the button
		flexContainer.style.justifyContent = "space-between"; // Optional: Distribute space between items

		// Engine URL Setting
		const engineUrlSetting = new Setting(flexContainer)
			.setName(`${engine.name} URL`)
			.setDesc(`URL of the ${engine.name} server.`)
			.addText((text) =>
				text.setValue(plugin.settings.engines[engine.id].url).onChange(async (value) => {
					plugin.settings.engines[engine.id].url = this.cleanUrl(value);
					await plugin.saveSettings();
				})
			)
			.addExtraButton((button) =>
				button
					.setIcon("plug-zap")
					.setTooltip("Check server")
					.onClick(async () => {
						new Notice(`Server ${engine.name} is ` + ((await this.isServerOnline(plugin.settings.engines[engine.id].url)) ? `online` : `offline`) + `!`);
					})
			);

		// Access the input element directly to apply custom styles
		engineUrlSetting.settingEl.style.width = "100%";
		const inputElement = engineUrlSetting.controlEl.querySelector("input");
		if (inputElement) {
			inputElement.style.width = "100%";
		}

		// Default Model Dropdown, to be populated
		const modelsDropdown = new Setting(engineSettingDiv)
			.setName("Default Model")
			.setDesc(`Default model for ${engine.name} engine.`)
			.addDropdown((dropdown) => {
				// Populate the dropdown with the models available for the engine
				const options: Record<string, any> = Object.entries(plugin.settings.engines[engine.id].models).reduce(
					(acc: Record<string, any>, [key, value]) => {
						acc[key] = value.name;
						return acc;
					},
					{}
				);
				// Add the options to the dropdown
				dropdown
					.addOptions(options)
					.setValue(plugin.settings.engines[engine.id].defaultModel)
					.onChange(async (value) => {
						plugin.settings.engines[engine.id].defaultModel = value;
						await plugin.saveSettings();
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon("list-end")
					.setTooltip("Fetch models from server")
					.onClick(async () => {
						new Notice("Fetching models...");
						const selectElement = modelsDropdown.controlEl.querySelector(`select`);
						if (selectElement) {
							selectElement.innerHTML = "";
							// Fetch the models from the server
							const ollamaAPI = new OllamaAPI(plugin.settings.engines[engine.id].url);
							ollamaAPI.listLocalModels().then(async (response) => {
								console.log("Response of fetching models... ", response);
								plugin.settings.engines[engine.id].models = response
									.map((model: any) => {
										return { [model.name]: model };
									})
									.reduce((acc: any, cur: any) => {
										return { ...acc, ...cur };
									});

								response.forEach((elem: any) => {
									selectElement.add(new Option(elem.model, elem.name));
								});

								await plugin.saveSettings();
							});
						}
					})
			);
	}

	display(): void {
		const { containerEl, plugin } = this;
		const { ollama, jan } = DEFAULT_SETTINGS.engines;

		containerEl.empty();

		// Engine Configuration Section
		containerEl.createEl("h3", { text: "Engine Settings" });
		containerEl.createEl("p", { text: "Customize the AI engine used for processing your notes. Select your preferred engine." });

		// Engine Selection
		this.setEngineSelection(plugin, containerEl);
		this.createEngineSettings(plugin, containerEl, ollama);
		this.createEngineSettings(plugin, containerEl, jan);
	}
}
