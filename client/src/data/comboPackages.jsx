import { Crown, Gift, Star } from "lucide-react";

  const comboPackages = [
    {
      id: 1,
      title: 'Bridal Bliss Package',
      subtitle: 'Perfect for your special day',
      price: 22999,
      duration: '4 hours',
      services: [
        'Luxury Hydrating Facial',
        'Anti-Aging Treatment',
        'Eye Rejuvenation',
        'Bridal Makeup',
        'Hair Styling'
      ],
      image: 'https://images.pexels.com/photos/3985354/pexels-photo-3985354.jpeg',
      icon: <Crown className="text-yellow-500" size={24} />,
      features: ['Pre-wedding consultation', 'Touch-up kit included', '6 months skincare plan']
    },
    {
      id: 2,
      title: 'Skin Rejuvenation Combo',
      subtitle: 'Complete skin transformation',
      price: 18499,
      duration: '3 hours',
      services: [
        'Anti-Aging Treatment',
        'Brightening Facial',
        'Acne Treatment',
        'Chemical Peel',
      ],
      image: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg',
      icon: <Star className="text-purple-500" size={24} />,
      features: ['Home care kit', '3 follow-up sessions', 'Progress tracking']
    },
    {
      id: 3,
      title: 'Seasonal Glow Package',
      subtitle: 'Refresh for the season',
      price: 13499,
      duration: '2.5 hours',
      services: [
        'Brightening Facial',
        'Hydrating Treatment',
        'Body Exfoliation',
        'Moisturizing Wrap'
      ],
      image: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400',
      icon: <Gift className="text-blue-500" size={24} />,
      features: ['Seasonal skincare tips', 'Product samples', 'Maintenance guide']
    }
  ];
 export default comboPackages; 