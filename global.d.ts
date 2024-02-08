type Engine = "Ollama" | "Jan" | "LocalAI" | "default";

/**
 * Represents a command configuration.
 */
interface Command {
	name: string;
	prompt: string;
	engine: Engine;
	model?: string;
	temperature?: number;
}

/**
 * Represents information about an engine.
 */
interface EngineInfo {
	id: string;
	name: Engine;
	url: string;
	defaultModel: string;
	models: Record<string, ModelInfo>;
}

/**
 * Represents information about a model.
 */
interface ModelInfo {
	name: string;
	model: string;
	modified_at: string;
	size: number;
	digest: string;
	// TODO: Replace `any` with specific types if possible
	// TODO: Define the structure of the model properties
	details: any;
}

/**
 * Represents the application settings.
 */
interface Settings {
	defaultEngine: string;
	engines: { [key: string]: EngineInfo };
	commands: Command[];
}

/**
 * Represents the options for generating chat completions.
 */
interface OptionsChat {
	images?: string[];
	format?: "json";
	options?: any;
	template?: string;
	stream?: boolean;
}

/**
 * Represents the options for generating completions.
 */
interface Options extends OptionsChat {
	system?: string;
	context?: any;
	raw?: boolean;
}

/**
 * Represents the Ollama API.
 */
// TODO: Replace `any` with specific types if possible
interface OllamaAPI {
	generateChatCompletion(model: string, messages: any[], options?: OptionsChat): Promise<any>;
	generateCompletion(model: string, prompt: string, options?: Options): Promise<any>;
	createModel(name: string, modelfile?: string, path?: string): Promise<any>;
	listLocalModels(): Promise<any>;
	showModelInformation(name: string): Promise<any>;
	copyModel(source: string, destination: string): Promise<any>;
	deleteModel(name: string): Promise<any>;
	pullModel(name: string, insecure?: boolean): Promise<any>;
	pushModel(name: string, insecure?: boolean): Promise<any>;
	generateEmbeddings(model: string, prompt: string, options?: any): Promise<any>;
}
