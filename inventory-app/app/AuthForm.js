// components/AuthForm.js
import { useState } from "react";
import { auth } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Box, Button, TextField, Typography, Snackbar, Alert } from "@mui/material";

export default function AuthForm({ onAuthChange }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthChange(auth.currentUser);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onAuthChange(auth.currentUser);
      }
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onAuthChange(null);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={3}
      maxWidth={400}
      margin="auto"
    >
      <Typography variant="h4">{isLogin ? "Login" : "Register"}</Typography>
      <TextField
        label="Email"
        variant="outlined"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAuth}
        fullWidth
        style={{ marginTop: 16 }}
      >
        {isLogin ? "Login" : "Register"}
      </Button>
      <Button
        variant="text"
        onClick={() => setIsLogin(!isLogin)}
        fullWidth
        style={{ marginTop: 16 }}
      >
        {isLogin ? "Create an account" : "Already have an account? Login"}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleSignOut}
        fullWidth
        style={{ marginTop: 16 }}
      >
        Sign Out
      </Button>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
