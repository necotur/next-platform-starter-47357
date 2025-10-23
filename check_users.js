const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.user.findMany({
    where: { role: 'doctor' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true
    }
  });
  
  console.log('Doctors:', JSON.stringify(doctors, null, 2));
  
  const connections = await prisma.patientDoctorConnection.findMany({
    include: {
      patient: { select: { id: true, email: true, fullName: true } },
      doctor: { select: { id: true, email: true, fullName: true } }
    }
  });
  
  console.log('\nConnections:', JSON.stringify(connections, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
