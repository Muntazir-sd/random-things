'use client';

import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { setLocalLanguage } from '@/utils/lang';
import americanFlag from '@/assets/lang/unitedStateFlag.svg';
import saudiArebiaFlag from '@/assets/lang/saudiArebiaFlag.svg';
import iranFlag from '@/assets/lang/iranFlag.svg';
import chinaFlag from '@/assets/lang/chinaFlag.svg';
import spainFlag from '@/assets/lang/spainFlag.svg';
import franceFlag from '@/assets/lang/franceFlag.svg';
import russianFlag from '@/assets/lang/russianFlag.svg';
import portugalFlag from '@/assets/lang/portugalFlag.svg';
import malaysiaFlag from '@/assets/lang/malaysia.svg';
import indonesiaFlag from '@/assets/lang/indonesiaFlag.svg';
import nigeriaFlag from '@/assets/lang/nigeriaFlag.svg';
import Image from 'next/image';
import { Box } from '@mui/material';
import { useGoogleTranslate } from '@/context/GoogleTranslateProvider/GoogleTranslateProvider';

type TranslateColorMode = 'dark' | 'light';
interface GoogleTranslateProps {
  theme?: TranslateColorMode;
}

function GoogleTranslate({ theme = 'dark' }: GoogleTranslateProps) {
  const { language, setLanguage } = useGoogleTranslate();

  const languages = [
    {
      code: 'en',
      name: 'English',
      emoji: americanFlag,
      localName: 'English',
    },
    {
      code: 'ar',
      name: 'Arabic',
      emoji: saudiArebiaFlag,
      localName: 'العربية',
    },
    { code: 'fr', name: 'French', emoji: franceFlag, localName: 'Français' },
    { code: 'es', name: 'Spanish', emoji: spainFlag, localName: 'Español' },
    { code: 'fa', name: 'Persian', emoji: iranFlag, localName: 'فارسی' },
    { code: 'ru', name: 'Russian', emoji: russianFlag, localName: 'Русский' },
    {
      code: 'pt',
      name: 'Portuguese',
      emoji: portugalFlag,
      localName: 'Português',
    },
    { code: 'zh-CN', name: 'Chinese', emoji: chinaFlag, localName: '中文' },
    {
      code: 'id',
      name: 'Indonesian',
      emoji: indonesiaFlag,
      localName: 'Bahasa Indonesia',
    },
    {
      code: 'ms',
      name: 'Malay',
      emoji: malaysiaFlag,
      localName: 'Bahasa Melayu',
    },
    {
      code: 'ha',
      name: 'Hausa',
      emoji: nigeriaFlag,
      localName: 'Hausa',
    },
  ];

  const switchLanguage = (lang: string) => {
    setLanguage(lang);
    setLocalLanguage(lang);
  };

  const handleChange = (event: SelectChangeEvent) => {
    switchLanguage(event.target.value);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <Select
        className="skiptranslate visible"
        value={language}
        onChange={handleChange}
        MenuProps={{
          className: 'skiptranslate visible',
        }}
        sx={{
          color: theme === 'dark' ? 'common.white' : 'common.black',
          '& .MuiFormLabel-root': {
            color: theme === 'dark' ? 'common.white' : 'common.black',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'none',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme === 'dark' ? 'common.white' : 'common.black',
          },
          '& .MuiSvgIcon-root': {
            color: theme === 'dark' ? 'common.white' : 'common.black',
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            value={lang.code}
            sx={{
              textAlign: 'center',
            }}
          >
            <Box
              display={'inline-flex'}
              alignItems={'center'}
              justifyContent={'center'}
              width={'fit-content'}
              // sx={{ gap: 1 }}
            >
              {
                <Image
                  src={lang.emoji}
                  style={{ marginInlineEnd: 5 }}
                  alt="abc"
                  height={25}
                  width={25}
                />
              }
              {lang.localName}
            </Box>{' '}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
export default GoogleTranslate;
