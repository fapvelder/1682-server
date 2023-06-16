import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { UserModel } from './models/user.js'
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'
dotenv.config()
export const generateToken = (user) => {
  return jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  )
}
export const generateSteamToken = (user) => {
  return jwt.sign(
    {
      id: user._json.steamid,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  )
}
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  )
}
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
}
export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization
  if (authorization) {
    const token = authorization.slice(7, authorization.length)
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid token' })
      } else {
        req.user = decode
        next()
      }
    })
  } else {
    res.status(401).send({ message: 'No token' })
  }
}
export const isAdmin = (req, res, next) => {
  const authorization = req.headers.authorization
  if (authorization) {
    const token = authorization.slice(7, authorization.length)
    jwt.verify(token, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid token' })
      } else {
        try {
          const userID = decode._id
          const user = await UserModel.findById(userID).populate('role')
          if (user.role.roleName === 'Admin') {
            req.user = decode
            next()
          } else {
            res.status(403).send({ message: 'User do not have permission' })
          }
        } catch (err) {
          res.status(500).send({ message: err.message })
        }
      }
    })
  } else {
    res.status(401).send({ message: 'No token' })
  }
}
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  return track[str2.length][str1.length]
}
export const slug = (title) => {
  return (
    title
      .toLowerCase()
      .split(/[ ]/)
      .filter((item) => item)
      .join('-') +
    '-' +
    Math.floor(Math.random() * 1000)
  )
}

export const generateRandomPassword = (length) => {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }

  return password
}
export const generateRandomSecret = () => {
  const charset = '0123456789'

  let secret = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    secret += charset[randomIndex]
  }

  return secret
}

export const createSlug = (fullName) => {
  // Prepare the slug
  let slug = ''

  // If full name is available, append it to the slug
  if (fullName) {
    const nameSlug = fullName.toLowerCase().replace(/\s+/g, '-') // Convert to lowercase and replace spaces with dashes
    slug += nameSlug
  }

  // Append UUID to the slug
  const uuid = uuidv4()
  slug += (slug ? '-' : '') + uuid

  return slug
}
