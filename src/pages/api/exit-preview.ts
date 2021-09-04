export default async (_,response) => {
  response.clearPreviewData();

  response.writeHead(307, {Location: '/'})
  response.end()
}