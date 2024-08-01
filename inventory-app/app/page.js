'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { Box, Modal, Stack, Typography, TextField, Button, IconButton, Snackbar, Alert } from "@mui/material";
import { collection, doc, getDoc, query, getDocs, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import { blue, grey } from "@mui/material/colors";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
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
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await updateDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    setSnackbarMessage(`${item.charAt(0).toUpperCase() + item.slice(1)} added to inventory`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    await updateInventory();
  }

  const removeItem = async (item) => {
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
  }

  // Handle open
  const handleOpen = () => setOpen(true);
  // Handle close
  const handleClose = () => setOpen(false);

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    const filteredItems = inventory.filter(item =>
      item.name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredInventory(filteredItems);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  return (
    <Box
      width='100vw'
      height='100vh'
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      gap={2}
      flexDirection={"column"}
      bgcolor={grey[200]}
    >
      <Modal open={open} onClose={handleClose}>
        <Box
          position={"absolute"}
          top={"50%"}
          left={"50%"}
          width={"400px"}
          bgcolor={"white"}
          borderRadius={2}
          boxShadow={24}
          p={4}
          display={"flex"}
          flexDirection={"column"}
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h6" color={"black"}>
            Add Item
          </Typography>
          <Stack width={"100%"} direction={"row"} spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
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
          onClick={() => handleOpen()}
          sx={{ mb: 2 }}
        >
          Add New Item
        </Button>
      </Stack>
      <Box width='800px'>
        <Box
          width='100%'
          height='100px'
          bgcolor={blue[500]}
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
            <Box key={name} width={'100%'} minHeight={'100px'} display={"flex"} alignItems={"center"} justifyContent={"space-between"} padding={2} bgcolor={grey[100]} borderRadius={1}>
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
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
