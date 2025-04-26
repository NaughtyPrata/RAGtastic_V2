/**
 * Mock API functions for UI demo
 */

// API class
class RAGAPI {
    constructor() {
        this.isProcessing = false;
    }

    async testConnection() {
        return { status: "connected" };
    }

    async listDocuments() {
        return [
            "document1.pdf",
            "document2.pdf",
            "document3.pdf",
            "document4.pdf",
            "document5.pdf",
            "document6.pdf",
            "document7.pdf"
        ];
    }

    async query(question, documents = []) {
        return {
            answer: "This is a mock response for the UI demo.",
            source_documents: [
                { 
                    metadata: { source: "document1.pdf", page: 1 },
                    page_content: "This is sample content from document 1."
                },
                { 
                    metadata: { source: "document2.pdf", page: 5 },
                    page_content: "This is sample content from document 2."
                }
            ]
        };
    }

    async getAnswer(question, documents = []) {
        return {
            answer: "This is a mock answer for the UI demo."
        };
    }

    async getSources(question, k = 4, documents = []) {
        const sources = [];
        for (let i = 0; i < k; i++) {
            sources.push({
                metadata: { source: `document${i+1}.pdf`, page: i+1 },
                page_content: `This is sample content from document ${i+1}.`
            });
        }
        return { sources };
    }

    async reset() {
        return { status: "reset" };
    }
    
    async preprocessDocuments(documents = []) {
        return { status: "processed", count: documents.length };
    }
}

// Create global API instance
const api = new RAGAPI();
