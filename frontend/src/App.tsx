import { useState } from 'react';
import { Sidebar, type Page } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { HallsPage } from '@/pages/HallsPage';
import { SeatDesignerPage } from '@/pages/SeatDesignerPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendeesPage } from '@/pages/AttendeesPage';
import { AssignmentPage } from '@/pages/AssignmentPage';
import { PresentationPage } from '@/pages/PresentationPage';
import { PrintPage } from '@/pages/PrintPage';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [designerHallId, setDesignerHallId] = useState<string | null>(null);

  const handleNavigate = (page: Page) => {
    if (page !== 'designer') {
      setDesignerHallId(null);
    }
    setCurrentPage(page);
  };

  const handleOpenDesigner = (hallId: string) => {
    setDesignerHallId(hallId);
    setCurrentPage('designer');
  };

  const handleBackFromDesigner = () => {
    setDesignerHallId(null);
    setCurrentPage('halls');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col">
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'halls' && <HallsPage onOpenDesigner={handleOpenDesigner} />}
        {currentPage === 'designer' && designerHallId && (
          <SeatDesignerPage hallId={designerHallId} onBack={handleBackFromDesigner} />
        )}
        {currentPage === 'designer' && !designerHallId && (
          <HallsPage onOpenDesigner={handleOpenDesigner} />
        )}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'attendees' && <AttendeesPage />}
        {currentPage === 'assignment' && <AssignmentPage />}
        {currentPage === 'presentation' && <PresentationPage />}
        {currentPage === 'print' && <PrintPage />}
      </main>
    </div>
  );
}

export default App;
