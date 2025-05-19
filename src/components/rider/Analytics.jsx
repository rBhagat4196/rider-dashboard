import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = ({ riderData }) => {
  // Process the rider data to generate analytics
  const processRideData = () => {
    if (!riderData?.previousRides || riderData.previousRides.length === 0) {
      return {
        totalRides: 0,
        totalSpent: 0,
        totalDistance: 0,
        modeDistribution: [],
        farePerKm: 0,
        recentRides: []
      };
    }

    const totalRides = riderData.previousRides.length;
    const totalSpent = riderData.previousRides.reduce((sum, ride) => sum + ride.totalFare, 0);
    const totalDistance = riderData.previousRides.reduce((sum, ride) => sum + ride.totalDistance, 0);
    const farePerKm = totalDistance > 0 ? totalSpent / totalDistance : 0;

    // Group rides by mode (auto/cab)
    const modeDistribution = riderData.previousRides.reduce((acc, ride) => {
      const existingMode = acc.find(item => item.name === ride.mode);
      if (existingMode) {
        existingMode.value += 1;
        existingMode.totalFare += ride.totalFare;
        existingMode.totalDistance += ride.totalDistance;
      } else {
        acc.push({
          name: ride.mode,
          value: 1,
          totalFare: ride.totalFare,
          totalDistance: ride.totalDistance
        });
      }
      return acc;
    }, []);

    // Get last 3 rides (most recent)
    const recentRides = [...riderData.previousRides];

    return {
      totalRides,
      totalSpent,
      totalDistance,
      farePerKm,
      modeDistribution,
      recentRides
    };
  };

  const stats = processRideData();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ride Analytics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Rides</h3>
          <p className="text-3xl font-bold">{stats.totalRides}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Spent</h3>
          <p className="text-3xl font-bold">₹{stats.totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Distance</h3>
          <p className="text-3xl font-bold">{stats.totalDistance.toFixed(1)} km</p>
        </div>
      </div>

      {/* Mode Distribution */}
      {stats.modeDistribution.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Ride Type Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.modeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.modeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    const ride = props.payload;
                    return [
                      `${value} rides`,
                      `Avg. ₹${(ride.totalFare / value).toFixed(2)} per ride`,
                      `Avg. ${(ride.totalDistance / value).toFixed(1)} km per ride`
                    ];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Rides */}
      {stats.recentRides.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Rides</h2>
          <div className="space-y-3">
            {stats.recentRides.map((ride, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{ride.mode}</span>
                  <span className="text-indigo-600">₹{ride.totalFare.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{ride.startAddress} → {ride.destinationAddress}</p>
                  <p className="mt-1">{ride.totalDistance} km</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Analysis */}
      {stats.totalRides > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Cost Analysis</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-500">Average per Ride</p>
              <p className="text-xl font-bold">
                ₹{(stats.totalSpent / stats.totalRides).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cost per Kilometer</p>
              <p className="text-xl font-bold">
                ₹{stats.farePerKm.toFixed(2)}/km
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.totalRides === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-lg font-semibold mb-2">No Ride History Yet</h2>
          <p className="text-gray-600">Complete your first ride to see analytics</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;