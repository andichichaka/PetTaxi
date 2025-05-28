import { User } from 'src/users/user.entity';
import { Service } from '../../entities/service.entity';
import { Location } from '../../entities/location.entity';

export class PostResponseDto {
    id: number;
    imagesUrl: string[];
    description: string;
    animalType: string;
    animalSizes: string[];
    location: Location;
    user: User;
    services: Omit<Service, 'post'>[];
}
