// Validation minimale pour job staging-test
export const validate = (options) => {
  return typeof options.maxDim === 'number' && options.maxDim > 0 && typeof options.quality === 'number' && options.quality >= 0 && options.quality <= 1
}