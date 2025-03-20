  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDl9D_bpaWdFctF8zICA_TYhYA0r1unpC8",
    authDomain: "simons-testdatabase.firebaseapp.com",
    projectId: "simons-testdatabase",
    storageBucket: "simons-testdatabase.firebasestorage.app",
    messagingSenderId: "407427913637",
    appId: "1:407427913637:web:716ff5acc745fa6273fa4c"
  };

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const database = firebase.firestore()

  console.log('fire base initialized')