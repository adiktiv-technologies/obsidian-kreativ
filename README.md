# Kreativ

**Privacy-first AI for Obsidian — powered by local models, zero cloud dependency.**

Kreativ brings AI capabilities directly into your vault using on-device Large Language Models. No API keys, no subscriptions, no data leaving your computer. Just intelligent text processing that works entirely offline.

## Why Kreativ?

### 🔒 **100% Local & Private**

-   All AI models run on your device using `transformers.js`
-   Zero cloud services, zero tracking, zero data collection
-   Your notes never leave your vault
-   Works completely offline after initial model download
-   Perfect for sensitive personal notes, research, or professional writing

### ⚡ **Desktop-Optimized Performance**

-   Powered by ONNX Runtime for fast inference
-   Models automatically cached for instant subsequent use
-   Smart resource management — models load on-demand
-   Built specifically for Obsidian desktop (Windows, macOS, Linux)

### 🎯 **Currently Available Features**

**Sentiment Analysis**  
Analyze the emotional tone of your writing. Get instant feedback on whether text reads as positive or negative — useful for journaling, reviewing communications, or refining tone.

**Text Translation**  
Translate between English, German, French, and Romanian using T5 Small model. No internet required, no character limits, complete privacy.

**Rephrase**  
Quickly improve text clarity with typo correction and sentence restructuring. Great for polishing rough drafts or fixing quick notes.

**Rewrite with Style**  
Transform text using preset styles (formal, casual, concise, elaborate, simplify) or provide custom instructions. Make the same content work for different audiences or purposes.

### 🚀 **Roadmap**

_Future features in development:_

-   Chat with your vault — ask questions answered from your notes
-   Document summarization — distill long notes into key insights
-   Smart content generation — brainstorm ideas grounded in your knowledge base
-   Intelligent note linking — discover connections across your vault

## Getting Started

### Installation

1. Install Kreativ from Obsidian's Community Plugins browser
2. Enable the plugin in **Settings → Community plugins**
3. Access features via:
    - **Command Palette** (Ctrl/Cmd+P) → search "Kreativ"
    - **Ribbon Icon** → click the brain icon for quick menu
    - **Editor Context Menu** → select text and right-click

### First Use

Models download automatically on first use:

-   **Sentiment Analysis:** ~250 MB (DistilBERT SST-2)
-   **Translation:** ~60 MB (T5 Small)
-   **Rephrase/Rewrite:** ~1 GB (LaMini Flan-T5 248M)

Downloads happen once and are cached locally in `.kreativ/` inside your vault.

**Settings Options:**

-   Enable/disable individual features
-   Auto-load models on startup (faster first use, uses more memory)
-   Configure default languages and styles
-   Manage model cache

## Privacy & Data

**What stays local:**

-   All AI processing happens on your device
-   Models are downloaded from HuggingFace and cached locally
-   No telemetry, analytics, or usage tracking
-   No network requests after initial model download

**Internet usage:**

-   Model downloads only (one-time per model)
-   No ongoing cloud connectivity required
-   Can be used 100% offline after setup

## Requirements

-   **Obsidian Desktop** (Windows, macOS, or Linux)
-   **~2 GB disk space** (for all models)
-   **4+ GB RAM recommended** (for smooth performance)
-   **Internet connection** (one-time, for model downloads)

## Support & Contributing

Found a bug or have a feature request?

-   **GitHub Issues:** [Report issues or suggest features](https://github.com/adiktiv-technologies/obsidian-kreativ/issues)
-   **Discussions:** [Join the conversation](https://github.com/adiktiv-technologies/obsidian-kreativ/discussions)
-   **Pull Requests:** Contributions welcome! Please open an issue first to discuss major changes.

## License

MIT License — see [LICENSE](LICENSE) for details.

## About

Built by [Adiktiv Technologies, Inc.](https://www.adiktiv-technologies.com) — creating privacy-focused tools that empower knowledge workers.
