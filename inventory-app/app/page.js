'use client';

import { useState, useRef, useEffect } from "react";
import axios from 'axios';
import { firestore } from "@/firebase";
import {
  Box, Stack, Typography, TextField, Button, IconButton, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { collection, doc, getDoc, query, getDocs, updateDoc, setDoc, deleteDoc, where } from "firebase/firestore";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Webcam from 'react-webcam';
import AuthForm from "@/app/AuthForm";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7e21ff',
    },
    secondary: {
      main: '#121212',
    },
    background: {
      default: '#121212',
      paper: '#1c1c1c',
    },
    text: {
      primary: '#ffffff',
      secondary: '#ae97c6',
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [user, setUser] = useState(null);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (user) {
      updateInventory();
    }
  }, [user]);

  const updateInventory = async () => {
    if (!user) return;
    const snapshot = query(collection(firestore, `users/${user.uid}/inventory`));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    setFilteredInventory(inventoryList);
  };

  const addItem = async (item) => {
    if (!user) return;
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await updateDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1, userId: user.uid });
    }
    setSnackbarMessage(`${item.charAt(0).toUpperCase() + item.slice(1)} added to inventory`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    await updateInventory();
  };

  const removeItem = async (item) => {
    if (!user) return;
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
        setSnackbarMessage(`${item.charAt(0).toUpperCase() + item.slice(1)} removed from inventory`);
      } else {
        await updateDoc(docRef, { quantity: quantity - 1 });
        setSnackbarMessage(`One unit of ${item.charAt(0).toUpperCase() + item.slice(1)} removed`);
      }
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
    await updateInventory();
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    const filteredItems = inventory.filter(item =>
      item.name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredInventory(filteredItems);
  };

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setWebcamOpen(false);

    const formData = new FormData();
    formData.append('image', imageSrc);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { items } = response.data;
      setDetectedItems(items);
      setConfirmOpen(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbarMessage('Error processing image');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleConfirm = async () => {
    for (const item of detectedItems) {
      await addItem(item);
    }
    setDetectedItems([]);
    setConfirmOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        width='100vw'
        height='100vh'
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={2}
        flexDirection="column"
        bgcolor="background.default"
        p={2}
      >
        {!user ? (
          <AuthForm onAuthChange={setUser} />
        ) : (
          <>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Search Inventory"
                variant="outlined"
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon position="start" />,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Add Item
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PhotoCamera />}
                onClick={() => setWebcamOpen(true)}
              >
                Scan Inventory
              </Button>
            </Stack>
            <Box mt={4} width="100%" maxWidth="600px" maxHeight="400px" overflow="auto">
              <Stack spacing={2}>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <Box
                      key={item.name}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      bgcolor="background.paper"
                      borderRadius={2}
                    >
                      <Typography variant="h6" color="text.primary">
                        {item.name} - Quantity: {item.quantity}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => addItem(item.name)}>
                          <AddIcon />
                        </IconButton>
                        <IconButton onClick={() => removeItem(item.name)}>
                          <RemoveIcon />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    No items in inventory. Add a new item to get started.
                  </Typography>
                )}
              </Stack>
            </Box>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Enter the name of the item you want to add to your inventory.
                </DialogContentText>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Item Name"
                  type="text"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                  if (itemName.trim()) {
                    addItem(itemName);
                    setItemName('');
                    setDialogOpen(false);
                  }
                }}>Add</Button>
              </DialogActions>
            </Dialog>
            <Dialog open={webcamOpen} onClose={() => setWebcamOpen(false)}>
              <DialogTitle>Scan Inventory</DialogTitle>
              <DialogContent>
                <Webcam
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  ref={webcamRef}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setWebcamOpen(false)}>Cancel</Button>
                <Button onClick={capture}>Capture</Button>
              </DialogActions>
            </Dialog>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Confirm Detected Items</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  The following items were detected. Confirm to add them to your inventory.
                </DialogContentText>
                <Box mt={2}>
                  {detectedItems.map((item, index) => (
                    <Typography key={index} variant="body1">{item}</Typography>
                  ))}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirm}>Confirm</Button>
              </DialogActions>
            </Dialog>
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={3000}
              onClose={() => setSnackbarOpen(false)}
            >
              <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
            </Snackbar>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
