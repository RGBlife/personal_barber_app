import React, { useState } from 'react';

const CalendarApp = () => {
  const [inputText, setInputText] = useState('');
  const [parsedEvents, setParsedEvents] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse input text - automatically detect format
  const parseInput = () => {
    setErrorMessage('');
    if (!inputText.trim()) {
      setErrorMessage('Please enter appointment details');
      return;
    }

    setIsProcessing(true);

    try {
      let events = [];
      const lines = inputText.split('\n').filter(line => line.trim() !== '');
      
      // Process all lines looking for date patterns
      let i = 0;
      while (i < lines.length) {
        // Look for date pattern like "11 Apr 2025" or "17 May 2025"
        const dateMatch = lines[i].match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
        
        if (dateMatch) {
          const dateStr = dateMatch[0];
          i++; // Move past date
          
          // Try to determine format by looking at next lines
          let format1 = false; 
          let format2 = false;
          
          // Check if next line has "Upcoming" (Format 1 indicator)
          if (i < lines.length && !lines[i].match(/\d{1,2}:\d{2}/) && !lines[i].match(/\*/)) {
            format1 = true;
          }
          
          // Check if next line has time followed by asterisk (Format 2 indicator)
          if (i < lines.length && lines[i].match(/\d{1,2}:\d{2}/) && 
              i+1 < lines.length && lines[i+1].match(/\*/)) {
            format2 = true;
          }
          
          // Default to Format 2 if we can't determine
          const detectedFormat = format1 ? 1 : 2;
          
          if (detectedFormat === 1) {
            // Skip "Upcoming" or similar header if present
            if (i < lines.length && !lines[i].match(/\d{1,2}:\d{2}/)) {
              i++;
            }
            
            const location = i < lines.length ? lines[i] : '';
            i++;
            
            // Time pattern like "17:00pm"
            const timeMatch = i < lines.length ? lines[i].match(/(\d{1,2}):(\d{2})(?:am|pm)?/) : null;
            const timeStr = timeMatch ? lines[i] : '';
            i++;
            
            const service = i < lines.length ? lines[i] : '';
            i++;
            
            // Check for "with [name]" pattern
            const stylistMatch = i < lines.length ? lines[i].match(/with\s+(.+)/) : null;
            const stylist = stylistMatch ? stylistMatch[1] : '';
            i++;
            
            // Skip any additional details until next date or end
            while (i < lines.length && !lines[i].match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/)) {
              i++;
            }
            
            // Parse date and time
            const [day, month, year] = dateStr.split(' ');
            let hours = 0, minutes = 0;
            if (timeMatch) {
              hours = parseInt(timeMatch[1]);
              minutes = parseInt(timeMatch[2]);
              // Adjust for PM if needed and not already in 24-hour format
              if (timeStr.toLowerCase().includes('pm') && hours < 12) {
                hours += 12;
              }
            }
            
            const startDate = new Date(`${month} ${day}, ${year} ${hours}:${minutes}:00`);
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Add 30 min
            
            events.push({
              title: `${location} - ${service} with ${stylist}`,
              startDate: startDate,
              endDate: endDate,
              location: location,
              description: `${service} with ${stylist}`,
              format: "Format 1"
            });
          } else {
            // Format 2 processing
            // Time pattern like "13:00pm"
            const timeMatch = i < lines.length ? lines[i].match(/(\d{1,2}):(\d{2})(?:am|pm)?/) : null;
            const timeStr = timeMatch ? lines[i] : '';
            i++;
            
            // Service may be prefixed with bullet or asterisk
            const serviceMatch = i < lines.length ? lines[i].match(/(?:\*\s*|\•\s*)?(.+)/) : null;
            const service = serviceMatch ? serviceMatch[1] : '';
            i++;
            
            // Check for "with [name]" pattern
            const stylistMatch = i < lines.length ? lines[i].match(/with\s+(.+)/) : null;
            const stylist = stylistMatch ? stylistMatch[1] : '';
            i++;
            
            // Price and duration information
            let price = '';
            let duration = '30 mins'; // Default duration
            
            // Look for price pattern like "£19.50"
            if (i < lines.length && lines[i].match(/£\d+(\.\d+)?/)) {
              price = lines[i];
              i++;
            }
            
            // Look for duration pattern like "30 mins"
            if (i < lines.length && lines[i].match(/\d+\s+mins?/)) {
              duration = lines[i];
              i++;
            }
            
            // Skip remaining lines until next date or end
            while (i < lines.length && !lines[i].match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/)) {
              i++;
            }
            
            // Parse date and time
            const [day, month, year] = dateStr.split(' ');
            let hours = 0, minutes = 0;
            if (timeMatch) {
              hours = parseInt(timeMatch[1]);
              minutes = parseInt(timeMatch[2]);
              // Adjust for PM if needed and not already in 24-hour format
              if (timeStr.toLowerCase().includes('pm') && hours < 12) {
                hours += 12;
              }
            }
            
            const startDate = new Date(`${month} ${day}, ${year} ${hours}:${minutes}:00`);
            
            // Calculate duration in minutes
            const durationMatch = duration.match(/(\d+)/);
            const durationMins = durationMatch ? parseInt(durationMatch[1]) : 30;
            const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
            
            // Default location
            const location = "Gentlemen Jacks";
            
            events.push({
              title: `${location} - ${service} with ${stylist}`,
              startDate: startDate,
              endDate: endDate,
              location: location,
              description: `${service} with ${stylist}\nPrice: ${price}\nDuration: ${duration}`,
              format: "Format 2"
            });
          }
        } else {
          i++; // Skip line if not a date pattern
        }
      }
      
      if (events.length === 0) {
        setErrorMessage('No valid appointments found. Please check the format and try again.');
        setIsProcessing(false);
        return;
      }
      
      setParsedEvents(events);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error parsing input:', error);
      setErrorMessage('Failed to parse appointment details. Please check the format and try again.');
      setIsProcessing(false);
    }
  };

  // Function to generate ICS content
  const generateICS = (event) => {
    // Function to format date in local time (not UTC)
    const formatDate = (date) => {
      // Format as YYYYMMDDTHHMMSS
      const pad = (num) => (num < 10 ? '0' : '') + num;
      
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Barber Appointment//Calendar App//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@barberappt.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART;VALUE=DATE-TIME:${formatDate(event.startDate)}`,
      `DTEND;VALUE=DATE-TIME:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  // Function to download ICS file
  const downloadICS = (event) => {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barber_appointment_${event.startDate.toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to open directly in calendar app
  const openInCalendar = (event) => {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Barber Appointment Calendar</h1>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="input-text">
            Paste your appointment details:
          </label>
          <textarea 
            id="input-text"
            className="w-full h-40 p-3 border rounded resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your appointment details here..."
          />
        </div>
        
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={parseInput}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Parse Appointment'}
        </button>
        
        {errorMessage && (
          <div className="mt-3 text-red-600 text-sm">{errorMessage}</div>
        )}
      </div>
      
      {parsedEvents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Parsed Appointments</h2>
          
          <div className="space-y-6">
            {parsedEvents.map((event, index) => (
              <div key={index} className="border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {event.startDate.toLocaleDateString('en-GB', { 
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {event.format}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Time: {event.startDate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
                <p className="font-medium mt-2">{event.title}</p>
                <div className="whitespace-pre-line text-gray-600 text-sm mt-1">
                  {event.description}
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={() => downloadICS(event)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Download ICS File
                  </button>
                  
                  <button 
                    onClick={() => openInCalendar(event)}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm font-medium inline-flex items-center"
                  >
                    Add to Apple Calendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarApp;