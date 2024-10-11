import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const fetchResearcherDataById = async (scholarId, college, department) => {
  const researcherDocRef = doc(
    db,
    `colleges/${college}/departments/${department}/faculty_members/${scholarId}`
  );
  const researcherDoc = await getDoc(researcherDocRef);
  return researcherDoc.exists() ? researcherDoc.data() : null;
};

export const fetchPublicationsByScholarId = async (scholarId, college, department) => {
  const publicationsCollection = collection(
    db,
    `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`
  );
  const publicationsSnapshot = await getDocs(publicationsCollection);

  const publicationsByYear = {};

  publicationsSnapshot.forEach(doc => {
    const publication = doc.data();
    const pubYear = publication.pub_year;

    if (pubYear && pubYear > 1970) {
      if (!publicationsByYear[pubYear]) {
        publicationsByYear[pubYear] = 1;
      } else {
        publicationsByYear[pubYear] += 1;
      }
    }
  });

  const sortedYears = Object.keys(publicationsByYear).sort((a, b) => a - b);

  const formattedData = sortedYears.map(year => ({
    name: year,
    publications: publicationsByYear[year]
  }));

  return formattedData;
};
