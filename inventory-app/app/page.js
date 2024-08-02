'use client';

import { useState, useEffect } from "react";
import { firestore, auth } from "@/firebase";
import { Box, Stack, Typography, TextField, Button, IconButton, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { collection, doc, getDoc, query, getDocs, updateDoc, setDoc, deleteDoc, where } from "firebase/firestore";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import AuthForm from "@/app/AuthForm"; // Import AuthForm component
import { blue } from '@mui/material/colors'; // Import blue color

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

  const updateInventory = async () => {
    if (!user) return;
    const snapshot = query(collection(firestore, 'inventory'), where('userId', '==', user.uid));
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
    const docRef = doc(collection(firestore, 'inventory'), item);
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
    const docRef = doc(collection(firestore, 'inventory'), item);
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

  const handleAuthChange = (user) => {
    setUser(user);
    if (user) {
      updateInventory();
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    const filteredItems = inventory.filter(item =>
      item.name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredInventory(filteredItems);
  };

  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const handleAddItem = () => {
    if (itemName) {
      addItem(itemName);
      setItemName('');
      handleDialogClose();
    }
  };

  return (
    <Box
      width='100vw'
      height='100vh'
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      gap={2}
      flexDirection={"column"}
      bgcolor="background.default"
    >
      {!user ? (
        <AuthForm onAuthChange={handleAuthChange} />
      ) : (
        <>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Search items..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleDialogOpen}
            >
              Add New Item
            </Button>
          </Stack>
          <Box width='800px'>
            <Box
              width='100%'
              height='100px'
              bgcolor="primary.main"
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              borderRadius={'8px 8px 0 0'}
            >
              <Typography variant={"h2"} color={"white"}>Inventory Items</Typography>
            </Box>
            <Stack
              width='100%'
              height='400px'
              spacing={2}
              sx={{ overflowY: "auto", bgcolor: "white", borderRadius: '0 0 8px 8px' }}
              p={2}
            >
              {filteredInventory.map(({ name, quantity }) => (
                <Box key={name} width={'100%'} minHeight={'100px'} display={"flex"} alignItems={"center"} justifyContent={"space-between"} padding={2} bgcolor="grey.100" borderRadius={1}>
                  <Typography variant={"h5"} color={"black"}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant={"h6"} color={"black"}>
                    Quantity: {quantity}
                  </Typography>
                  <Stack direction={"row"} spacing={1}>
                    <IconButton sx={{ color: blue[500] }} onClick={() => addItem(name)}>
                      <AddIcon />
                    </IconButton>
                    <IconButton sx={{ color: blue[500] }} onClick={() => removeItem(name)}>
                      <RemoveIcon />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
          <Dialog open={dialogOpen} onClose={handleDialogClose}>
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
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button onClick={handleAddItem}>Add</Button>
            </DialogActions>
          </Dialog>
          <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
            <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}
