import React from 'react'

type Props = {
    pdf_url: string,
}

const PDFViewer = ({pdf_url}: Props) => {
  return (
    // <iframe src={`https://docs.google.com/gview?url={pdf_url}&embedded=true`} className='w-full h-full'></iframe>
    <iframe src={`https://docs.google.com/gview?url=https://chat-with-pdf-et.s3.ap-south-2.amazonaws.com/uploads/1753412802729-Eeshal_Sai_Kumar_Teluri.pdf&embedded=true`} className='w-full h-full'></iframe>
  )
}

export default PDFViewer