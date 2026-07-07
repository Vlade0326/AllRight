import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { AuthGuard } from '../guards/auth.guard';

@Module({
  imports: [ApplicationModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthPresentationModule {}
