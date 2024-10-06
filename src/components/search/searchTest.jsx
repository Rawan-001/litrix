// App.js
import React, { useState } from "react";
import { collection, doc, getDocs, getDoc } from "firebase/firestore"; // Import getDoc to fetch the document
import { db } from "../../firebaseConfig"; // Import Firebase database

function SearchTable() {
  const [scholarId, setScholarId] = useState(""); // To store the entered Scholar ID
  const [researcherData, setResearcherData] = useState(null); // To store researcher data
  const [publicationsData, setPublicationsData] = useState(null); // To store publications data
  const [loading, setLoading] = useState(false); // To show loading state
  const [error, setError] = useState(""); // To store any error

  // Function to fetch researcher data and publications from Firestore
  const fetchResearcherData = async (scholarId) => {
    setLoading(true);
    setError(""); // Clear current error
    try {
      // Path to the researcher document
      const researcherDocRef = doc(
        db,
        `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}`
      );

      // Fetch researcher data
      const researcherDoc = await getDoc(researcherDocRef);

      if (researcherDoc.exists()) {
        setResearcherData(researcherDoc.data()); // Store researcher data

        // Use collection to fetch all publications of the researcher
        const publicationsRef = collection(
          db,
          `colleges/faculty_computing/departments/dept_cs/faculty_members/${scholarId}/publications`
        );
        const querySnapshot = await getDocs(publicationsRef);

        if (!querySnapshot.empty) {
          // Fetch data and convert to array
          const publications = querySnapshot.docs.map((doc) => doc.data());
          setPublicationsData(publications); // Store publications data
        } else {
          setPublicationsData(null);
          setError("No publications found for this researcher.");
        }
      } else {
        setResearcherData(null);
        setPublicationsData(null);
        setError("No data found for this researcher.");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
    }
    setLoading(false);
  };

  // Function to handle search when the search button is clicked
  const handleSearch = () => {
    if (scholarId) {
      fetchResearcherData(scholarId); // Call fetchResearcherData function
    } else {
      setError("Please enter a valid Scholar ID.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Fetch Researcher Data and Publications</h1>
      <input
        type="text"
        placeholder="Enter Scholar ID"
        value={scholarId}
        onChange={(e) => setScholarId(e.target.value)}
        style={{ padding: "10px", marginRight: "10px" }}
      />
      <button onClick={handleSearch} style={{ padding: "10px" }}>
        Search
      </button>

      {loading && <p>Loading...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {researcherData && (
        <div>
          <h2>Researcher Data:</h2>
          <pre>{JSON.stringify(researcherData, null, 2)}</pre>
        </div>
      )}

      {publicationsData && (
        <div>
          <h2>Researcher's Publications:</h2>
          <pre>{JSON.stringify(publicationsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SearchTable;
