import { useEffect, useState } from 'react';

const SHEET_ID = '1OZhhk8KbDWs0eM--Mjsr7Q0n1mngWgt9bFWPafp9Mwc';
const sheets = ['3','4']; // Add more years as needed
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PRICE = 37;
const currentMounth = new Date().getMonth() - 1; // 0-11 for Jan-Dec
const currentYear = new Date().getFullYear(); // e.g. 2024

type UserRow = {
  Name: string;
  [month: string]: string; // "0" or "1" (or whatever) for each month key
};

type DataByYear = {
  2024: UserRow[];
  2025: UserRow[]; // Optional, in case you want  to add future years
};

type UnpaidMonth = {
  year: number;
  month: string;
}

export default function App() {
  const [data, setData] = useState<DataByYear | null>(null);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [unpaid, setUnpaid] = useState<UnpaidMonth[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch sheets on mount
  useEffect(() => {
    Promise.all(
      sheets.map(sheet =>
        fetch(`https://opensheet.elk.sh/${SHEET_ID}/${sheet}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch sheet ${sheet}: ${res.status}`);
            return res.json();
          })
      )
    )
      .then(results => {
        const dataByYear: DataByYear = {
          2024: results[0],
          2025: results[1] || [] // Optional, in case you want to add future years
        };
        setData(dataByYear);

        // Extract all unique user names from all sheets combined
        const namesSet = new Set<string>();
        for (const year of sheets) {
          results[sheets.indexOf(year)].forEach((row: UserRow) => {
            if (row.Name) namesSet.add(row.Name);
          });
        }
        setAllUsers(Array.from(namesSet).sort());
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch data. Please try again later.');
      });
  }, []);

  // Update unpaid months and total when user or data changes
  useEffect(() => {
    if (!data || !selectedUser) {
      setUnpaid([]);
      setTotal(0);
      return;
    }

    // Combine all years data into one array
    // const combinedData = [...data[2024], ...(data[2025] || [])];
    const combinedData = [
      ...data[2024].map(row => ({ ...row, __year: 2024 } as UserRow & {__year: number })),
      ...data[2025].map(row => ({ ...row, __year: 2025 } as UserRow & {__year: number }))
    ];
    
    // const user = combinedData.find(u => u.Name === selectedUser);
    const user = combinedData.filter(u => u.Name === selectedUser);
    console.log("combinedData", combinedData);
    console.log("user", user);
    const unpaidList: UnpaidMonth[] = [];

  user.forEach(user => {
  MONTHS.forEach(month => {
    if (user[month] === "1") {
      if( user.__year < currentYear ||
          (user.__year === currentYear && MONTHS.indexOf(month) <= currentMounth)) {
        unpaidList.push({ year: user.__year, month });
          }  
    }
  });
});

setUnpaid(unpaidList);
setTotal(unpaidList.length * PRICE);

    
  }, [selectedUser, data]);
  

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spotify Payment Status</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && !data && <p>Loading data...</p>}

      {data && (
        <>
          <label>
            Select User:&nbsp;
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">-- Choose --</option>
              {allUsers.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          {selectedUser && (
            <>
              <h2>Unpaid Months</h2>
              {unpaid.length > 0 ? (
              <ul>
                  {unpaid.map(({ year, month }) => (
                    <li key={`${year}-${month}`}>{month} {year}</li>
                  ))}
                </ul>

              ) : (
                <p>All payments are up to date!</p>
              )}
              <h3>Total Due: Baht {total.toFixed(2)}</h3>
            </>
          )}
        </>
      )}
    </div>
  );
}
