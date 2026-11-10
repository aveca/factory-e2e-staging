// Validation minimale pour job job-issue77-mwan4x9r
export const validate = (options) => {
  return typeof options.maxDim === 'number' && options.maxDim > 0 && typeof options.quality === 'number' && options.quality >= 0 && options.quality <= 1
}
