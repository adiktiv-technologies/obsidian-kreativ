import { requestUrl } from "obsidian";

/**
 * OllamaAPI - Implement the interface with a class
 * Example usage:
 * const ollamaAPI = new OllamaAPI(window.fetch.bind(window), 'http://localhost:11434');
 * ollamaAPI.generateCompletion('llama2', 'Why is the sky blue?').then(console.log);
 */
export class OllamaAPI implements OllamaAPI {
	private apiEndpoint: string;

	constructor(url: string) {
		this.apiEndpoint = url;
	}

	private async makeRequest(endpoint: string, method = "GET", body?: any): Promise<any> {
		const url = `${this.apiEndpoint}/${endpoint}`;
		const response = await requestUrl({
			url,
			method,
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});

		if (!response.status || response.status !== 200) {
			throw new Error(`API call to ${endpoint} failed: ${response.status}`);
		}

		return response.json.models;
	}

	async generateCompletion(model: string, prompt: string, options: Options = {}): Promise<any> {
		return this.makeRequest("api/generate", "POST", { model, prompt, ...options });
	}

	async generateChatCompletion(model: string, messages: any[], options: OptionsChat = {}): Promise<any> {
		return this.makeRequest("api/chat", "POST", { model, messages, ...options });
	}

	async createModel(name: string, modelfile?: string, path?: string): Promise<any> {
		return this.makeRequest("api/create", "POST", { name, modelfile, path });
	}

	async listLocalModels(): Promise<any> {
		return this.makeRequest("api/tags");
	}

	async showModelInformation(name: string): Promise<any> {
		return this.makeRequest("api/show", "POST", { name });
	}

	async copyModel(source: string, destination: string): Promise<any> {
		return this.makeRequest("api/copy", "POST", { source, destination });
	}

	async deleteModel(name: string): Promise<any> {
		return this.makeRequest("api/delete", "DELETE", { name });
	}

	async pullModel(name: string, insecure = false): Promise<any> {
		return this.makeRequest("api/pull", "POST", { name, insecure });
	}

	async pushModel(name: string, insecure = false): Promise<any> {
		return this.makeRequest("api/push", "POST", { name, insecure });
	}

	async generateEmbeddings(model: string, prompt: string, options: any = {}): Promise<any> {
		return this.makeRequest("api/embeddings", "POST", { model, prompt, ...options });
	}
}

