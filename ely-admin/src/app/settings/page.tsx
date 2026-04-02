import { db } from '@/lib/db';
import HotelSettingsForm from '@/components/HotelSettingsForm';

async function getHotel() {
  return db.hotel.findFirst({ where: { active: true }, include: { config: true } });
}

export default async function SettingsPage() {
  const hotel = await getHotel();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Hotel Settings</h2>
      <HotelSettingsForm hotel={hotel} />
    </div>
  );
}
