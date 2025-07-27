import {Pinecone} from "@pinecone-database/pinecone" 
import {downloadFromS3} from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

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

    return pages;
}