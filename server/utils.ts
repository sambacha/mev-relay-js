module.exports.writeError = (res: any, statusCode: any, errMsg: any) => {
  res.status(statusCode)
  res.json({ error: { message: errMsg } })
}
