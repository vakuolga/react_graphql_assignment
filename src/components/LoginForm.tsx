import React from 'react';
import { TextField, Box } from '@mui/material';
import { LoginFormProps } from './interfaces';

function LoginForm(props: LoginFormProps) {
  const { data, setData, setError } = props;
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  const handleChangeEmail = (email: string) => {
    if (!validateEmail(email)) setError('Your E-Mail Format is incorrect');
    else setError('');
    setData({
      ...data,
      email,
    });
  };
  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        '& .MuiTextField-root': { m: 1, width: '50ch' },
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        required
        id="email-input"
        type="email"
        label="Your E-Mail"
        variant="outlined"
        autoComplete="email"
        helperText={!data.email && 'Enter your E-Mail'}
        onChange={(event: React.ChangeEvent) => {
          handleChangeEmail((event.target as HTMLInputElement).value);
        }}
      />
      <TextField
        required
        id="password-input"
        type="password"
        label="Your Password"
        variant="outlined"
        autoComplete="current-password"
        helperText={!data.password && 'Enter your Password'}
        onChange={(event: React.ChangeEvent) =>
          setData({
            ...data,
            password: (event.target as HTMLInputElement).value,
          })
        }
      />
    </Box>
  );
}

export default LoginForm;