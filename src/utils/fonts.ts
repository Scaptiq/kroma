export type FontOption = {
    name: string;
    value: string;
};

export const PRESET_FONTS: FontOption[] = [
    { name: 'Segoe UI', value: 'Segoe UI' },
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Playfair Display', value: 'Playfair Display' },
    { name: 'Merriweather', value: 'Merriweather' },
    { name: 'Space Grotesk', value: 'Space Grotesk' },
    { name: 'Work Sans', value: 'Work Sans' },
    { name: 'DM Sans', value: 'DM Sans' },
    { name: 'Manrope', value: 'Manrope' },
    { name: 'Nunito', value: 'Nunito' },
    { name: 'Source Sans 3', value: 'Source Sans 3' },
    { name: 'Fira Sans', value: 'Fira Sans' },
    { name: 'Rubik', value: 'Rubik' },
    { name: 'Raleway', value: 'Raleway' },
    { name: 'Comic Neue', value: 'Comic Neue' },
    { name: 'Comfortaa', value: 'Comfortaa' },
    { name: 'Ubuntu', value: 'Ubuntu' },
];

const GOOGLE_WEIGHTS = 'wght@300;400;500;600;700';

const googleFamilies = PRESET_FONTS
    .map((font) => font.value)
    .filter((value) => value !== 'Segoe UI');

const encodeGoogleFamily = (family: string) => family.trim().replace(/\s+/g, '+');

export const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${googleFamilies
    .map((family) => `family=${encodeGoogleFamily(family)}:${GOOGLE_WEIGHTS}`)
    .join('&')}&display=swap`;
