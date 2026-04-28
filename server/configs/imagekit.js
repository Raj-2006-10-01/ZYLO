import Imagekit from 'imagekit'

const hasImagekitConfig = Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
);

const imagekit = hasImagekitConfig
    ? new Imagekit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    })
    : null;

export const isImagekitConfigured = hasImagekitConfig;

export default imagekit
