const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnection() {
  try {
    // Find Zainab_Laith
    const zainab = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'Zainab_Laith' },
          { email: 'Zainab_Laith' }
        ]
      }
    });
    
    console.log('Zainab user:', JSON.stringify(zainab, null, 2));
    
    // Find Muhammed_Yashar
    const muhammed = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'Muhammed_Yashar' },
          { email: 'Muhammed_Yashar' }
        ]
      }
    });
    
    console.log('\nMuhammed user:', JSON.stringify(muhammed, null, 2));
    
    if (zainab && muhammed) {
      // Check for connection
      const connection = await prisma.doctorPatient.findFirst({
        where: {
          patientId: zainab.id,
          doctorId: muhammed.id
        },
        include: {
          doctor: true,
          patient: true
        }
      });
      
      console.log('\nConnection found:', JSON.stringify(connection, null, 2));
      
      // Check all connections for this patient
      const allConnections = await prisma.doctorPatient.findMany({
        where: {
          patientId: zainab.id
        },
        include: {
          doctor: true
        }
      });
      
      console.log('\nAll connections for Zainab:', JSON.stringify(allConnections, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
