import gilbert2d from './gilbert2d'

export default function decrypt(img) {
  const cvs = document.createElement('canvas')
  const width = (cvs.width = img.width)
  const height = (cvs.height = img.height)
  const ctx = cvs.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const imgdata = ctx.getImageData(0, 0, width, height)
  const imgdata2 = new ImageData(width, height)
  const curve = gilbert2d(width, height)
  const offset = Math.round(((Math.sqrt(5) - 1) / 2) * width * height)

  for (let i = 0; i < width * height; i++) {
    const old_pos = curve[i]
    const new_pos = curve[(i + offset) % (width * height)]
    const old_p = 4 * (old_pos[0] + old_pos[1] * width)
    const new_p = 4 * (new_pos[0] + new_pos[1] * width)
    imgdata2.data.set(imgdata.data.slice(new_p, new_p + 4), old_p)
  }

  ctx.putImageData(imgdata2, 0, 0)

  const newImg = document.createElement('img')

  cvs.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob)
      // newImg.onload = () => {
      //   URL.revokeObjectURL(url)
      // }
      newImg.src = url
    },
    'image/jpeg',
    0.95
  )

  return newImg
}
