import { PlatformModel } from '../models/platform.js'

export const getPlatform = async (req, res) => {
  try {
    const platform = await PlatformModel.find({})
    res.send(platform)
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}
export const createPlatform = async (req, res, next) => {
  try {
    const newPlatform = req.body
    const platform = new PlatformModel(newPlatform)
    await platform.save()
    res.status(200).json(platform)
  } catch (err) {
    if (err.isJoi === true) {
      res.status(422).send({ message: `${err.details[0].message}` })
    }
    next(err)
  }
}
export const deletePlatform = async (req, res) => {
  try {
    const deletePlatform = req.params.id
    const platform = await PlatformModel.findByIdAndDelete(deletePlatform, {
      new: true,
    })
    res.status(200).json(platform)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const updatePlatform = async (req, res, next) => {
  try {
    const updatePlatform = req.body
    const platform = await PlatformModel.findByIdAndUpdate(
      { _id: updatePlatform._id },
      updatePlatform,
      { new: true }
    )
    res.status(200).json(platform)
  } catch (err) {
    if (err.isJoi === true) {
      res.status(422).send({ message: `${err.details[0].message}` })
    }
    next(err)
  }
}
