import { User } from 'src/users/user.entity';
import { Service } from '../service.entity';

export class PostResponseDto {
    id: number;
    description: string;
    animalType: string;
    animalSizes: string[];
    user: User;
    services: Omit<Service, 'post'>[];
}
