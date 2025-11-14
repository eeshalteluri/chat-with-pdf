import { Pinecone } from "@pinecone-database/pinecone"
import { converttoAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
    });
    const index = await pinecone.Index('chat-with-pdf-et');

    try{
        const namespace = converttoAscii(fileKey);
        const namespaceIndex = index.namespace(namespace); // <-- FIX: Create a namespaced index reference
        
        const finalQueryResult = await namespaceIndex.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
            // NO namespace property needed here!
        });

        return finalQueryResult.matches || [];
    }catch(error){
        console.log('error querying embeddings: ', error);
        throw error;
    }
}

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey)

    const qualifyingDocs = matches.filter(
        (match) => match.score && match.score > 0.7
    )

    type Metadata = {
        text: string,
        pageNumber: number
    }

    const docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)
    //5 vectors
    return docs.join('\n').substring(0, 3000);
}