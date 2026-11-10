// Validation minimale pour job job-issue77-mwankc0l
export const validate = (o) => typeof o.maxDim === 'number' && o.maxDim > 0 && typeof o.quality === 'number' && o.quality >= 0 && o.quality <= 1
