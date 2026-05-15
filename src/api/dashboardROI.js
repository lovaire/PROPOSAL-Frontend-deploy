import axios from 'axios';

export const getDashboardRoi = (startDate, endDate) => {
  const token = localStorage.getItem('token'); 
  return axios.get('/api/dashboard/roi', {
    params: {
      start: startDate,
      end: endDate
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};