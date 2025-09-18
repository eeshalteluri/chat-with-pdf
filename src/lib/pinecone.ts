import {Pinecone, PineconeRecord} from "@pinecone-database/pinecone" 
import {downloadFromS3} from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter"
import { getEmbeddings } from "./embeddings";
import md5 from "md5"
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data";
import { converttoAscii } from "./utils";

let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
    if(!pinecone){
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        });
    }

    return pinecone;
}

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
    }
}

export async function loadS3IntoPinecone(fileKey: string) {
    //1. Obtain the PDF -> download and read from pdf
    console.log('downloading s3 into file system');
    const file_name = await downloadFromS3(fileKey);

    if(!file_name){
        throw new Error('Couldnot download from s3');
    }

    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];

    //2. split and segment the pdf
    const documents = await Promise.all(pages.map(prepareDocument));
    console.log("Segmented PDF document data: ", documents)

    //3. vectorize and embed individual documents
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    //4. upload to pinecone
    const client = await getPinecone()
    const pineconeIndex = client.index('chat-with-pdf-et')

    console.log('inserting vectors into pinecone')
    const namespace = pineconeIndex.namespace(converttoAscii(fileKey));

    await namespace.upsert(vectors)
    return documents[0];
}

async function embedDocument(doc: Document) {
    try{
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        }as PineconeRecord

    }catch(error){
        console.log('error embedding document: ', error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage) {
    let {pageContent, metadata} = page;
    pageContent = pageContent.replace(/\n/g, ''); 

    //split the docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs;
}