const resourceResolver = {
  Query: {
    // get all files and other file related queries
    getFiles() {
      return 'files'
    },
  },
  Mutation: {
    // todo => properly stream the file to GridFS
    async singleUpload(root, { file }) {
      const { stream, filename, mimetype, encoding } = await file
      console.log(await filename)
      return { filename, mimetype, encoding }
    },
  },
}
